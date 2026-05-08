import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json

try:
    from supabase import create_client, Client
except ImportError:
    Client = None

logger = logging.getLogger(__name__)


class SupabaseReportManager:
    """Manage report storage in Supabase"""
    
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "").strip()
        self.key = os.getenv("SUPABASE_KEY", "").strip()
        self.client: Optional[Client] = None
        
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"❌ Supabase initialization error: {e}")
        else:
            logger.warning("⚠️  Supabase credentials not configured")
    
    def is_ready(self) -> bool:
        """Check if Supabase is configured"""
        return self.client is not None
    
    async def save_report(
        self,
        user_id: str,
        report_content: Dict[str, Any],
        is_permanently_saved: bool = False,
        expires_in_hours: int = 24
    ) -> Optional[str]:
        """
        Save diagnostic report to Supabase
        
        Args:
            user_id: UUID of the user
            report_content: Full report dictionary
            is_permanently_saved: Whether to mark as permanently saved
            expires_in_hours: Hours before report expires (default 24h)
        
        Returns:
            Report ID if successful, None otherwise
        """
        if not self.is_ready():
            logger.warning("Supabase not configured, skipping save")
            return None
        
        try:
            expiry_at = datetime.now() + timedelta(hours=expires_in_hours)
            status = "saved" if is_permanently_saved else "pending"
            
            data = {
                "user_id": user_id,
                "content": report_content,  # JSONB in PostgreSQL
                "status": status,
                "is_permanently_saved": is_permanently_saved,
                "expiry_at": expiry_at.isoformat(),
                "saved_at": datetime.now().isoformat() if is_permanently_saved else None,
            }
            
            response = self.client.table("reports").insert(data).execute()
            
            if response.data and len(response.data) > 0:
                report_id = response.data[0]["id"]
                logger.info(f"✅ Report saved to Supabase: {report_id}")
                return report_id
            else:
                logger.error("❌ No response from Supabase insert")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error saving report: {e}", exc_info=True)
            return None
    
    async def get_user_reports(
        self,
        user_id: str,
        limit: int = 50,
        status_filter: Optional[str] = None
    ) -> list:
        """Get user's reports from database"""
        if not self.is_ready():
            return []
        
        try:
            query = self.client.table("reports").select("*").eq("user_id", user_id)
            
            if status_filter:
                query = query.eq("status", status_filter)
            
            query = query.order("created_at", desc=True).limit(limit)
            response = query.execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching reports: {e}")
            return []
    
    async def delete_report(self, report_id: str, user_id: str) -> bool:
        """Soft delete (mark as deleted)"""
        if not self.is_ready():
            return False
        
        try:
            self.client.table("reports").update(
                {"status": "deleted"}
            ).eq("id", report_id).eq("user_id", user_id).execute()
            
            logger.info(f"✅ Report deleted: {report_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting report: {e}")
            return False
    
    async def mark_permanent(self, report_id: str, user_id: str) -> bool:
        """Mark report as permanently saved"""
        if not self.is_ready():
            return False
        
        try:
            self.client.table("reports").update({
                "is_permanently_saved": True,
                "status": "saved",
                "saved_at": datetime.now().isoformat()
            }).eq("id", report_id).eq("user_id", user_id).execute()
            
            logger.info(f"✅ Report marked as permanent: {report_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error marking permanent: {e}")
            return False
    
    async def reject_report(self, report_id: str, user_id: str) -> bool:
        """Temporarily reject report (temp_rejected status)"""
        if not self.is_ready():
            return False
        
        try:
            self.client.table("reports").update({
                "status": "temp_rejected"
            }).eq("id", report_id).eq("user_id", user_id).execute()
            
            logger.info(f"✅ Report rejected: {report_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error rejecting report: {e}")
            return False
    
    async def permanently_delete(self, report_id: str, user_id: str) -> bool:
        """Permanently delete report"""
        if not self.is_ready():
            return False
        
        try:
            self.client.table("reports").update({
                "status": "deleted"
            }).eq("id", report_id).eq("user_id", user_id).execute()
            
            logger.info(f"✅ Report permanently deleted: {report_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Error deleting report: {e}")
            return False
    
    async def get_pending_reports(self, user_id: str) -> list:
        """Get pending reports (will expire in 24h)"""
        if not self.is_ready():
            return []
        
        try:
            query = self.client.table("reports").select("*").eq("user_id", user_id).eq("status", "pending")
            query = query.order("created_at", desc=True).limit(100)
            response = query.execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching pending reports: {e}")
            return []
    
    async def get_saved_reports(self, user_id: str, limit: int = 50) -> list:
        """Get permanently saved reports"""
        if not self.is_ready():
            return []
        
        try:
            query = self.client.table("reports").select("*").eq("user_id", user_id).eq("status", "saved")
            query = query.order("saved_at", desc=True).limit(limit)
            response = query.execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching saved reports: {e}")
            return []


# Global instance
supabase_manager: Optional[SupabaseReportManager] = None

def get_supabase_manager() -> Optional[SupabaseReportManager]:
    """Get or create Supabase manager instance"""
    global supabase_manager
    if supabase_manager is None:
        supabase_manager = SupabaseReportManager()
    return supabase_manager

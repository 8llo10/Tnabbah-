import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  session: Session | null;
  profile: any | null;
  loading: boolean;
  isPasswordRecovery: boolean;

  refreshProfile: () => Promise<any | null>;
  updateProfileLocally: (updates: Record<string, any>) => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  isPasswordRecovery: false,

  refreshProfile: async () => null,
  updateProfileLocally: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const realUserId = session?.user?.id || null;

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log("Loading profile for:", userId);

      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile load timeout")), 10000)
      );

      const { data, error }: any = await Promise.race([
        profilePromise,
        timeoutPromise,
      ]);

      if (error) {
        console.log("Profile Load Error:", error.message || error);
        setProfile(null);
        return null;
      }

      setProfile(data ?? null);
      return data ?? null;
    } catch (error: any) {
      console.log("Profile Catch Error:", error?.message || error);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      setProfile(null);
      return null;
    }

    return await loadProfile(currentUserId);
  }, [session?.user?.id, loadProfile]);

  const updateProfileLocally = useCallback((updates: Record<string, any>) => {
    setProfile((prevProfile: any) => {
      if (!prevProfile) {
        return updates;
      }

      return {
        ...prevProfile,
        ...updates,
      };
    });
  }, []);

  const checkRecoveryStorage = async () => {
    try {
      const value = await AsyncStorage.getItem("password_recovery_flow");
      setIsPasswordRecovery(value === "true");
    } catch (error) {
      console.log("Recovery Storage Error:", error);
      setIsPasswordRecovery(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("Init Auth Started");

        await checkRecoveryStorage();

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.log("Get Session Error:", error.message);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);

        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              loadProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
        console.log("Init Auth Done");
      } catch (error: any) {
        console.log("Init Auth Catch Error:", error?.message || error);

        if (!mounted) return;

        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AUTH EVENT:", event);

      if (!mounted) return;

      setSession(session);

      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);

        AsyncStorage.setItem("password_recovery_flow", "true").catch((error) =>
          console.log("Set Recovery Storage Error:", error)
        );
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsPasswordRecovery(false);

        AsyncStorage.removeItem("password_recovery_flow").catch((error) =>
          console.log("Remove Recovery Storage Error:", error)
        );

        setLoading(false);
        return;
      }

      if (event === "USER_UPDATED") {
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              loadProfile(session.user.id);
            }
          }, 0);
        }

        setLoading(false);
        return;
      }

      if (session?.user) {
        setTimeout(() => {
          if (mounted) {
            loadProfile(session.user.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (!realUserId) return;

    const channel = supabase
      .channel(`profile-realtime-${realUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${realUserId}`,
        },
        (payload) => {
          console.log("Profile realtime update:", payload.eventType);

          if (payload.eventType === "DELETE") {
            setProfile(null);
            return;
          }

          if (payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log("Profile realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realUserId]);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isPasswordRecovery,

        refreshProfile,
        updateProfileLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
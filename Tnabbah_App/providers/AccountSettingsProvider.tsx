import React, { createContext, useContext } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

type AccountSettingsContextType = {
    updateName: (cleanName: string) => Promise<void>;
    updateEmail: (cleanEmail: string) => Promise<void>;
    deleteAccount: (password: string) => Promise<void>;
    logout: (disconnectObd?: () => Promise<void>) => Promise<void>;
};

const AccountSettingsContext =
    createContext<AccountSettingsContextType | null>(null);

export function AccountSettingsProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { session } = useAuth();

    const updateName = async (cleanName: string) => {
        const realUserId = session?.user?.id;
        if (!realUserId || !cleanName.trim()) {
            throw new Error("Missing user or name");
        }

        const finalName = cleanName.trim();

        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: finalName,
                updated_at: new Date().toISOString(),
            })
            .eq("id", realUserId);

        if (profileError) throw profileError;

        const { error: authError } = await supabase.auth.updateUser({
            data: {
                full_name: finalName,
                name: finalName,
                display_name: finalName,
            },
        });

        if (authError) throw authError;
    };

    const updateEmail = async (cleanEmail: string) => {
        const finalEmail = cleanEmail.trim().toLowerCase();

        if (!finalEmail || !finalEmail.includes("@")) {
            throw new Error("Invalid email");
        }

        const { error } = await supabase.auth.updateUser({
            email: finalEmail,
        });

        if (error) throw error;
    };

    const deleteAccount = async (password: string) => {
        const userEmail = session?.user?.email;

        if (!userEmail) {
            throw new Error("Missing email");
        }

        if (!password.trim()) {
            throw new Error("Missing password");
        }

        const { error: loginError } =
            await supabase.auth.signInWithPassword({
                email: userEmail,
                password,
            });

        if (loginError) {
            throw new Error("Incorrect password");
        }

        const {
            data: { session: freshSession },
        } = await supabase.auth.getSession();

        const accessToken = freshSession?.access_token;

        if (!accessToken) {
            throw new Error("No access token");
        }

        const response = await fetch(
            "https://qzhnghwmgujgthbkivdi.supabase.co/functions/v1/delete-account",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result?.error || "Delete failed");
        }
    };

    const logout = async (disconnectObd?: () => Promise<void>) => {
        if (disconnectObd) {
            await disconnectObd();
        }

        const { error } = await supabase.auth.signOut();

        if (error) throw error;
    };

    return (
        <AccountSettingsContext.Provider
            value={{
                updateName,
                updateEmail,
                deleteAccount,
                logout,
            }}
        >
            {children}
        </AccountSettingsContext.Provider>
    );
}

export function useAccountSettings() {
    const context = useContext(AccountSettingsContext);

    if (!context) {
        throw new Error(
            "useAccountSettings must be used inside AccountSettingsProvider"
        );
    }

    return context;
}
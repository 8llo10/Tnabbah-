import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
    session: Session | null;
    profile: any | null;
    loading: boolean;
    isPasswordRecovery: boolean;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    profile: null,
    loading: true,
    isPasswordRecovery: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    const recoveryModeRef = useRef(false);

    const loadProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.log("Profile Load Error:", error);
            return null;
        }

        setProfile(data);
        return data;
    };

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getSession();

            if (recoveryModeRef.current) {
                setSession(null);
                setProfile(null);
                setLoading(false);
                return;
            }

            setSession(data.session);

            if (data.session?.user) {
                await loadProfile(data.session.user.id);
            }

            setLoading(false);
        };

        init();

        const { data: listener } = supabase.auth.onAuthStateChange(
            async (event, authSession) => {
                console.log("AUTH EVENT:", event);

                if (event === "PASSWORD_RECOVERY") {
                    recoveryModeRef.current = true;
                    setIsPasswordRecovery(true);

                    // لا نخزن جلسة الريست كجلسة دخول عادية
                    setSession(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                if (recoveryModeRef.current && event !== "SIGNED_OUT") {
                    // أثناء reset password تجاهلي USER_UPDATED وغيره
                    // عشان ما يوديك Home
                    setIsPasswordRecovery(true);
                    setSession(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                if (event === "SIGNED_OUT") {
                    recoveryModeRef.current = false;
                    setIsPasswordRecovery(false);
                    setSession(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                setIsPasswordRecovery(false);
                setSession(authSession);

                if (authSession?.user) {
                    const profileData = await loadProfile(authSession.user.id);
                    setProfile(profileData);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                session,
                profile,
                loading,
                isPasswordRecovery,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
import {
  createContext,
  useContext,
  useEffect,
  useState,
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

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.log("Profile Load Error:", error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  };

  const checkRecoveryStorage = async () => {
    const value = await AsyncStorage.getItem("password_recovery_flow");
    return value === "true";
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const recoveryMode = await checkRecoveryStorage();
        setIsPasswordRecovery(recoveryMode);

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.log("Get Session Error:", error.message);
        }

        if (recoveryMode) {
          setSession(null);
          setProfile(null);
          return;
        }

        setSession(data.session);

        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.log("Auth Init Error:", error);
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log("AUTH EVENT:", event);

        try {
          setLoading(true);

          const recoveryModeFromStorage = await checkRecoveryStorage();

          const recoveryMode =
            recoveryModeFromStorage || event === "PASSWORD_RECOVERY";

          if (event === "PASSWORD_RECOVERY") {
            await AsyncStorage.setItem("password_recovery_flow", "true");
          }

          setIsPasswordRecovery(recoveryMode);

          if (recoveryMode) {
            setSession(null);
            setProfile(null);
            return;
          }

          setSession(authSession);

          if (authSession?.user) {
            await loadProfile(authSession.user.id);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.log("Auth State Change Error:", error);
          setSession(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
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
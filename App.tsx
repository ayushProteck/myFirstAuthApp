import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signOut,
} from "@react-native-firebase/auth";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { Formik } from "formik";
import * as Yup from "yup";

// -------------------- VALIDATION --------------------
// const AuthSchema = Yup.object().shape({
//   email: Yup.string().email("Invalid email").required("Email required"),
//   password: Yup.string()
//     .min(6, "Minimum 6 characters")
//     .required("Password required"),
// });

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  const AuthSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string()
      .min(6, "Minimum 6 characters")
      .required("Password required"),
    confirmPassword: Yup.string().when("password", {
      is: () => !isLogin,     // only validate in Signup
      then: (schema) =>
        schema
          .oneOf([Yup.ref("password"), null], "Passwords must match")
          .required("Confirm Password required"),
    }),
  });


  // -------------------- GOOGLE CONFIG --------------------
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "928743223488-trulkn2mibtj4dahbfeh2ob9n8sq48a0.apps.googleusercontent.com",
    });
  }, []);

  // -------------------- AUTH LISTENER --------------------
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return unsubscribe;
  }, []);

  // ========================================================
  //                     EMAIL & PASSWORD AUTH
  // ========================================================
  const handleEmailAuth = async (values) => {
    const { email, password } = values;
    const auth = getAuth();

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("Welcome Back!", `${email}`);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Account Created!", `For ${email}`);
      }
    } catch (err) {
      console.log("ERROR",err);
      // console.log(`${err.code}: ${"[] abc".} `);
      if(err.code === "auth/invalid-credential"){
        Alert.alert("Login Failed", "Wrong email id or password");
      } else if(err.code === "auth/email-already-in-use"){
        Alert.alert("Registration Failed", "This email is already in registered with another account");
      } else if(err.code === "auth/user-not-found") {
        Alert.alert("Login Failed" , "User not found with this email id");
      } else {
        console.log("Error",err);
        Alert.alert("Authentication error","Something went wrong");
      }
    }
  };

  // ========================================================
  //                     GOOGLE AUTH
  // ========================================================
  const handleGoogleLogin = async () => {
    const auth = getAuth();

    try {
      await GoogleSignin.hasPlayServices();

      const result = await GoogleSignin.signIn();

      let idToken =
        result.data?.idToken ??
        result.idToken ??
        result.id_token ??
        null;

      if (!idToken) throw new Error("Google ID Token missing");

      const googleCredential = GoogleAuthProvider.credential(idToken);

      const authUser = await signInWithCredential(auth, googleCredential);

      Alert.alert(
        "Welcome!",
        `Logged in as ${authUser.user.displayName || authUser.user.email}`
      );
    } catch (err) {
      console.error("GOOGLE SIGN-IN ERROR:", err);
      Alert.alert("Google Sign-In Error", err.message.split("]")[1]);
    }
  };

  // ========================================================
  //                     LOGOUT
  // ========================================================
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    Alert.alert("Logged Out", "You have been logged out successfully.");
  };

  // ========================================================
  //                     UI STARTS HERE
  // ========================================================
  return (
    <View style={styles.container}>
      {user ? (
        // -------------------- GREETING --------------------
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>
            Hello, {user.displayName || user.email}! 👋
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#e63946" }]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // -------------------- AUTH FORM --------------------
        <View>
          <Text style={styles.title}>{isLogin ? "Login" : "Sign Up"}</Text>

          <Formik
            initialValues={{ email: "", password: "", confirmPassword: "" }}
            validationSchema={AuthSchema}
            onSubmit={handleEmailAuth}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <>
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={values.email}
                  onChangeText={handleChange("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {touched.email && errors.email && (
                  <Text style={styles.error}>{errors.email}</Text>
                )}
          
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  style={styles.input}
                  value={values.password}
                  onChangeText={handleChange("password")}
                />
                {touched.password && errors.password && (
                  <Text style={styles.error}>{errors.password}</Text>
                )}
          
                {/* Show confirm password only when SIGNUP */}
                {!isLogin && (
                  <>
                    <TextInput
                      placeholder="Confirm Password"
                      secureTextEntry
                      style={styles.input}
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <Text style={styles.error}>{errors.confirmPassword}</Text>
                    )}
                  </>
                )}
          
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>
                    {isLogin ? "Login" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>


          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin
                ? "Create an account"
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 25 }} />

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "600",
  },
  switchText: {
    textAlign: "center",
    color: "#4f46e5",
    marginTop: 12,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#999",
    padding: 14,
    borderRadius: 10,
  },
  googleText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "red",
    marginBottom: 6,
    marginLeft: 4,
  },
});

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Import moved to top

    useEffect(() => {
        let unsubscribeUserDoc;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                // 1. Initial Set/Sync logic (keep existing)
                const userRef = doc(db, 'users', user.uid);

                try {
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const existingData = docSnap.data();
                        const updates = {
                            lastLoginAt: serverTimestamp(),
                            email: user.email
                        };

                        // Backfill credits/plan if missing (for existing users from before payment system)
                        if (existingData.credits === undefined) {
                            updates.credits = 10;
                            updates.plan = "free";
                            updates.features = {
                                canSave: false,
                                canShare: false
                            };
                        }

                        await setDoc(userRef, updates, { merge: true });
                    } else {
                        // First login: Create document with STRICT schema
                        await setDoc(userRef, {
                            uid: user.uid,
                            name: user.displayName || 'User',
                            email: user.email,
                            photoURL: user.photoURL,
                            plan: "free",
                            credits: 10,
                            features: {
                                canSave: false,
                                canShare: false
                            },
                            provider: 'google',
                            createdAt: serverTimestamp(),
                            lastLoginAt: serverTimestamp(),
                        });
                    }

                    // 2. Setup Realtime Listener
                    unsubscribeUserDoc = onSnapshot(userRef, (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            // Merge Firestore data into the auth user object or keep separate.
                            // Merging is convenient for usage: currentUser.credits

                            // Create a new object that inherits from the Firebase User object
                            const mergedUser = Object.create(user);
                            // Assign Firestore data as own properties
                            Object.assign(mergedUser, data);

                            setCurrentUser(mergedUser);
                        }
                    });

                } catch (e) {
                    console.error("Error updating user document:", e);
                    // Fallback if firestore fails, still set user but without perks?
                    setCurrentUser(user);
                }

            } else {
                // User is signed out.
                if (unsubscribeUserDoc) unsubscribeUserDoc();
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
        };
    }, []);

    const value = {
        currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

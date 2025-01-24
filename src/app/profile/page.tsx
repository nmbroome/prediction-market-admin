"use client";

import React, { useEffect, useState } from "react";
import supabase from '@/lib/supabase/createClient';
import { User } from "@supabase/supabase-js";
import Onboarding from "@/components/Onboarding";
import IQTest from "@/components/IQTest";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isInUserInfo, setIsInUserInfo] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        setUser(null);
        setIsInUserInfo(null);
        return;
      }

      setUser(userData.user);

      if (userData.user) {
        const { data: userInfoData, error: userInfoError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userData.user.id)
          .single();

        if (userInfoError) {
          console.error("Error checking user_info:", userInfoError.message);
          setIsInUserInfo(false);
        } else {
          setIsInUserInfo(!!userInfoData);
        }
      } else {
        setIsInUserInfo(false);
      }
    };

    fetchUserData();
  }, []);

  if (isInUserInfo === null) {
    return <p>Loading user data...</p>;
  }

  if (isInUserInfo === false) {
    return <Onboarding />;
  }

  return (
    <div className="container mt-4 text-white">
      {user ? (
        <>
          <h2>Your Profile</h2>
          <div className="mt-4">
            <div className="flex-col">
              <p>Email: {user.email}</p>
              <p>Balance: </p>
              <p>Player ID: </p>
            </div>
            <div className="flex-col">
              <p>Payment info</p>
            </div>
            <h3>Holdings</h3>
            <h3>Prediction history</h3>
          </div>
        </>
      ) : (
        <p>Loading user data or not logged in...</p>
      )}
    </div>
  );
}

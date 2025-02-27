"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase/createClient";
import { User } from "@supabase/supabase-js";

// Define the Profile type
interface Profile {
  id: string;
  username: string;
  email?: string;
  balance?: number;
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newUsername, setNewUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        return;
      }
      setUser(userData.user);

      // Fetch all profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, email, balance");

      if (profileError) {
        console.error("Error fetching profiles:", profileError.message);
        return;
      }

      setProfiles(profileData as Profile[]);
    };

    fetchData();
  }, []);

  const openEditModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setNewUsername(profile.username || "");
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
    setNewUsername("");
  };

  const saveUsername = async () => {
    if (!selectedProfile) return;
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", selectedProfile.id);

    if (updateError) {
      console.error("Error updating username:", updateError.message);
    } else {
      // Update local state to reflect changes
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === selectedProfile.id ? { ...profile, username: newUsername } : profile
        )
      );
      closeEditModal();
    }

    setLoading(false);
  };

  return (
    <div className="container mt-4 text-white">
      {user ? (
        <>
          <h2 className="text-2xl font-bold mb-4">User Profiles</h2>

          {/* List of all profiles */}
          <div className="border border-gray-600 p-4 rounded-lg">
            {profiles.length > 0 ? (
              <ul>
                {profiles.map((profile) => (
                  <li key={profile.id} className="flex justify-between items-center mb-2 p-2 border-b border-gray-500">
                    <span>
                      <strong>Username:</strong> {profile.username} <br />
                      <strong>Email:</strong> {profile.email || "N/A"} <br />
                      <strong>Balance:</strong> {profile.balance ?? "N/A"} <br />
                      <strong>Player ID:</strong> {profile.id}
                    </span>
                    <button
                      onClick={() => openEditModal(profile)}
                      className="bg-blue-500 text-white p-2 rounded"
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No profiles found.</p>
            )}
          </div>
        </>
      ) : (
        <p>Loading user data or not logged in...</p>
      )}

      {/* Edit Username Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl mb-2">Edit Username</h3>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="text-black p-2 rounded w-full"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={closeEditModal}
                className="bg-gray-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={saveUsername}
                className="bg-green-500 text-white p-2 rounded"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CircleUserRound, LayoutIcon, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

function SideNav() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient(); // Use client-side Supabase client
  const pathname = usePathname();

  useEffect(() => {
    // Fetch the authenticated user
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    };

    fetchUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    router.push("/login");
  };

  const menuList = [
    {
      id: 1,
      name: "Dashboard",
      icon: LayoutIcon,
      path: "/dashboard",
    },
    {
      id: 2,
      name: "Patients",
      icon: CircleUserRound,
      path: "/dashboard/patients",
    },
    {
      id: 3,
      name: "Settings",
      icon: Settings,
      path: "/dashboard/settings",
    },
  ];

  return (
    <div className="border shadow-md h-screen p-3 flex flex-col justify-between">
      <div>
        <Image src={"/images.png"} alt="Logo" width={45} height={45} />
        <hr className="my-5"></hr>
        {menuList.map((menu) => (
          <Link href={menu.path} key={menu.id}>
            <h2
              className={`flex items-center gap-3 text-md p-4 text-slate-500 hover:bg-primary hover:text-white cursor-pointer rounded-lg my-2
              ${pathname == menu.path && "bg-primary text-white"}`}
            >
              <menu.icon />
              {menu.name}
            </h2>
          </Link>
        ))}
      </div>

      <div>
        {user && (
          <div className="flex gap-2 items-center p-2 mb-4">
            <Image
              src={"/download.png"}
              width={35}
              height={35}
              alt="user"
              className="rounded-full"
            />
            <div>
              <h2 className="text-sm font-bold">
                {user.user_metadata?.full_name || "Username"}
              </h2>
              <h2 className="text-xs text-slate-400">{user.email}</h2>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-md p-4 text-slate-500 hover:bg-primary hover:text-white cursor-pointer rounded-lg w-full"
        >
          <LogOut />
          Logout
        </button>
      </div>
    </div>
  );
}

export default SideNav;

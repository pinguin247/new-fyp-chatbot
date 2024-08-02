import React from "react";
import Image from "next/image";
import { CircleUserRound, LayoutIcon, Settings } from "lucide-react";

function Header() {
  return (
    <div className="p-4 shadow-sm border flex justify-between">
      <div></div>
      <div>
        <Image
          src={"/download.png"}
          alt="user"
          width={45}
          height={45}
          className="rounded-full"
        />
      </div>
    </div>
  );
}

export default Header;

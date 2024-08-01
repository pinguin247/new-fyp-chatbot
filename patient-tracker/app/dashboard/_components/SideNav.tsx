import React from 'react'
import Image from 'next/image';
import { CircleUserRound, LayoutIcon, Settings } from 'lucide-react';

function SideNav() {
  const menuList=[
    {
      id:1,
      name:'Dashboard',
      icon:LayoutIcon,
      path:'/dashboard'
    },{
      id:2,
      name:'Patients',
      icon:CircleUserRound,
      path:'/dashboard/patients'
    },
    {
      id:3,
      name:'Settings',
      icon:Settings,
      path:'/dashboard/settings'
    }
  ]
  return (
    <div className='border shadow-md h-screen p-3'>
        <Image src={'/images.png'} alt="Logo" width={45} height={45}/>
        <hr className='my-5'></hr>
        {menuList.map((menu,index)=>(
          // eslint-disable-next-line react/jsx-key
          <h2 className='flex items-center gap-3 text-md p-4 text-slate-500 hover:bg-primary hover:text-white cursor-pointer rounded-lg my-2'>
            <menu.icon />
            {menu.name}
          </h2>
        ))}

        <div className='flex gap-2 items-center bottom-5 fixed p-2'>
          <Image src={'/download.png'} width={35} height={35} alt='user' className='rounded-full'/>
          <div>
            <h2 className='text-sm font-bold'>Username</h2>
            <h2 className='text-xs text-slate-400'>Email</h2>
          </div>
        </div>
    </div>
  )
}

export default SideNav
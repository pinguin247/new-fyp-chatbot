import React from 'react'
import Image from 'next/image';

function SideNav() {
  return (
    <div className='border shadow-md h-screen p-5'>
        <Image src={'/images.png'} alt="Logo" width={80} height={80}/>
    </div>
  )
}

export default SideNav
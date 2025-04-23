// components/layout/TopHeader.tsx
"use client";

import React from 'react';
import { FaPlus } from "react-icons/fa6";
import Image from 'next/image';
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'

const TopHeader = () => {
    return (
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-transparent">
            <div>
                <h1 className='font-bold text-3xl text-black'>Chat</h1>
            </div>
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700">
                    <FaPlus className="w-4 h-4" /> Chat
                </button>
                <SignedOut>
                    <SignInButton />
                    <SignUpButton />
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <div className="flex items-center gap-3">
                    <Image
                        src="https://randomuser.me/api/portraits/men/32.jpg"
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                    <span className="font-medium text-slate-800">Archit Rathod</span>
                </div>
            </div>

        </div>
    );
};

export default TopHeader;

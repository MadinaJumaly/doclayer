"use client"

import { useAuth } from "@/components/authProvider"; // AuthProvider
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";



export default function Home() {
  const { isAuthenticated, is_admin, user } = useAuth();
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-2 pb-20 gap-8 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center sm:items-start">
      {isAuthenticated && user?.role !== "user" && (
          <Button asChild>
            <Link href='/docs'>View Docs</Link>
          </Button>
        )}
      {isAuthenticated && is_admin && (
          <Button variant='outline' asChild>
            <Link href='/docs/create'>Create new doc</Link>
          </Button>
        )}
        </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
  
      </footer>
    </div>
  );
}

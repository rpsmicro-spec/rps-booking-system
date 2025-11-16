"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Briefcase, Users, Contact } from "lucide-react"

export function QuickActions() {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 md:gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto sm:flex-1">
            <Link href="/jobs/new" className="flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="whitespace-nowrap">Add Job</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto sm:flex-1">
            <Link href="/jobs" className="flex items-center justify-center">
              <Briefcase className="mr-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="whitespace-nowrap">View All Jobs</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto sm:flex-1">
            <Link href="/customers" className="flex items-center justify-center">
              <Contact className="mr-2 h-4 w-4 md:h-5 md:w-5 shrink-0" />
              <span className="whitespace-nowrap">Customers</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


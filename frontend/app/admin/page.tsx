"use client"

import { useState } from "react"
import {
  FileSpreadsheet,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  ListChecks,
  Users,
  ClipboardList,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Tabs } from "@/components/ui/Tabs"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/Button"
import { BulkUpload } from "@/components/admin/BulkUpload"
import { ManualInternshipForm } from "@/components/admin/ManualInternshipForm"
import { ManageInternships } from "@/components/admin/ManageInternships"
import { ManageUsers } from "@/components/admin/ManageUsers"
import { ManageApplicants } from "@/components/admin/ManageApplicants"

const TABS = [
  { key: "bulk", label: "Bulk Import (Excel)", icon: FileSpreadsheet },
  { key: "manual", label: "Add Manually", icon: PlusCircle },
  { key: "manage", label: "Manage / Delete", icon: ListChecks },
  { key: "applicants", label: "Applicants", icon: ClipboardList },
  { key: "users", label: "Users", icon: Users },
]

export default function AdminPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState("bulk")

  // DashboardShell already guards for authentication; here we additionally
  // gate on the admin flag.
  return (
    <DashboardShell>
      {!user?.is_admin ? (
        <EmptyState
          icon={ShieldAlert}
          title="Admin access required"
          description="This area is restricted to administrators. If you believe this is a mistake, contact your platform administrator."
          action={
            <Button href="/dashboard" variant="primary">
              Back to dashboard
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Admin — Internships
                </h1>
                <Badge variant="default">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Add internships in bulk from an Excel sheet, or create them one at a
                time.
              </p>
            </div>
          </div>

          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          <div className="mt-6">
            {tab === "bulk" && <BulkUpload />}
            {tab === "manual" && <ManualInternshipForm />}
            {tab === "manage" && <ManageInternships />}
            {tab === "applicants" && <ManageApplicants />}
            {tab === "users" && <ManageUsers />}
          </div>
        </>
      )}
    </DashboardShell>
  )
}

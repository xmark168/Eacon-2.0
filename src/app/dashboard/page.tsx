import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentImages } from '@/components/dashboard/RecentImages'
import { TokenUsage } from '@/components/dashboard/TokenUsage'
import { AccountStatus } from '@/components/dashboard/AccountStatus'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayout>
      <DashboardHeader user={session.user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <TokenUsage tokens={session.user.tokens} />
          <AccountStatus />
        </div>
      </div>
      
      <RecentImages userId={session.user.id} />
    </DashboardLayout>
  )
} 
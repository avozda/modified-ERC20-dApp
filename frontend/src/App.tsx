import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@/lib/protected-route";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Mint } from "@/pages/Mint";
import { Approval } from "@/pages/Approval";
import { AddressManagement } from "@/pages/AddressManagement";
import { TransferRestrict } from "@/pages/TransferRestrict";
import { IdentityProviderManagement } from "@/pages/IdentityProviderManagement";
import { MintingAdminVoting } from "@/pages/MintingAdminVoting";
import { RestrictionAdminVoting } from "@/pages/RestrictionAdminVoting";
import { IDPAdminVoting } from "@/pages/IDPAdminVoting";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/user-context";
import { useAuth } from "./lib/auth";
import { useReadContract } from "wagmi";
import ContractOptions from "@/lib/contract";
import { PageLoader } from "./components/ui/overlay/PageLoader";
import { UnknownError } from "./components/ui/overlay/UnknownError";
import { useEffect } from "react";

function App() {
  const { walletAddress } = useAuth();
  console.log("Wallet Address: ", walletAddress);
  const { data, error, isLoading, refetch } = useReadContract({
    ...ContractOptions,
    functionName: 'getAddressInfo',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    refetch();
  }, [walletAddress, refetch]);

  const userInfo = data ? {
    dailyTransferred: data[0],
    dailyMinted: data[1],
    transferLimit: data[2],
    isVerified: data[3],
    isBlocked: data[4],
    isIdentityProvider: data[5],
    isMintingAdmin: data[6],
    isRestrictionAdmin: data[7],
    isIdpAdmin: data[8],
  } : null;


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <PageLoader />
    </div>
  }
  if (error) {
    return <div className="flex items-center justify-center h-screen">
      <UnknownError onRetry={refetch} />
    </div>
  }
  return (
    <>
      <BrowserRouter>
        <UserProvider data={
          userInfo
        }>
          <Routes>
            <Route path="/auth" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mint"
              element={
                <ProtectedRoute requiredRole="mintingAdmin">
                  <DashboardLayout>
                    <Mint />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approval"
              element={
                <ProtectedRoute requiredRole="notBlocked">
                  <DashboardLayout>
                    <Approval />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/address-management"
              element={
                <ProtectedRoute requiredRole="restrictionAdmin">
                  <DashboardLayout>
                    <AddressManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer-restrict"
              element={
                <ProtectedRoute requiredRole="restrictionAdmin">
                  <DashboardLayout>
                    <TransferRestrict />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/identity-providers"
              element={
                <ProtectedRoute requiredRole="idpAdmin">
                  <DashboardLayout>
                    <IdentityProviderManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/minting-admin-voting"
              element={
                <ProtectedRoute requiredRole="mintingAdmin">
                  <DashboardLayout>
                    <MintingAdminVoting />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/restriction-admin-voting"
              element={
                <ProtectedRoute requiredRole="restrictionAdmin">
                  <DashboardLayout>
                    <RestrictionAdminVoting />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/idp-admin-voting"
              element={
                <ProtectedRoute requiredRole="idpAdmin">
                  <DashboardLayout>
                    <IDPAdminVoting />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </UserProvider>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;

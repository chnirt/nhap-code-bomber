"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Trash2,
  RefreshCw,
  Search,
  Play,
  Edit2,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { redeemCode as redeemCodeAction } from "./actions";

type UserStatus = "idle" | "processing" | "success" | "failed" | "redeemed";

interface UserData {
  id: string;
  userId: string;
  status: UserStatus;
  message?: string;
  lastUpdated?: string;
}

export default function RedeemPage() {
  const [redeemCode, setRedeemCode] = useState("BOMBERPC");
  const [userIdInput, setUserIdInput] = useState("");
  const [userList, setUserList] = useState<UserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true); // bắt đầu loading
    const savedData = localStorage.getItem("redeem_app_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.userList) setUserList(parsed.userList);
        if (parsed.redeemCode) setRedeemCode(parsed.redeemCode);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoading(false); // kết thúc loading
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "redeem_app_data",
      JSON.stringify({ userList, redeemCode })
    );
  }, [userList, redeemCode]);

  const handleAddUsers = () => {
    setDuplicateError(null);
    if (!userIdInput.trim()) return;

    const lines = userIdInput
      .split(/[\n,]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const newUsers: UserData[] = [];
    const existingIds = new Set(userList.map((u) => u.userId));
    const duplicates: string[] = [];

    lines.forEach((id) => {
      if (existingIds.has(id)) {
        duplicates.push(id);
      } else {
        newUsers.push({
          id: crypto.randomUUID(),
          userId: id,
          status: "idle",
          lastUpdated: new Date().toLocaleString(),
        });
        existingIds.add(id);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateError(`Các User ID đã tồn tại: ${duplicates.join(", ")}`);
    }

    if (newUsers.length > 0) {
      setUserList((prev) => [...prev, ...newUsers]);
      setUserIdInput("");
      if (duplicates.length === 0) setIsAddDialogOpen(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    setUserList((prev) => prev.filter((user) => user.id !== id));
  };

  const handleUpdateUser = () => {
    if (!editingUser || !editValue.trim()) return;
    const isDuplicate = userList.some(
      (u) => u.userId === editValue && u.id !== editingUser.id
    );
    if (isDuplicate) {
      alert("User ID này đã tồn tại!");
      return;
    }
    setUserList((prev) =>
      prev.map((u) =>
        u.id === editingUser.id ? { ...u, userId: editValue } : u
      )
    );
    setEditingUser(null);
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setEditValue(user.userId);
  };

  const handleScan = async () => {
    if (!redeemCode) {
      alert("Vui lòng nhập Redeem Code!");
      return;
    }
    setIsProcessing(true);
    const usersToProcess = [...userList];

    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      updateUserStatus(user.id, "processing");

      try {
        const result = await redeemCodeAction(user.userId, redeemCode);

        let statusText = "";
        let statusType: UserStatus = "failed";

        if (result.success) {
          const data = result.data;

          // Code hết lượt
          if (
            data?.errorCode === 2117 &&
            data?.message?.includes("usage limit")
          ) {
            statusText = "Code đã hết lượt sử dụng";
          }

          // Tài khoản không tồn tại
          else if (data?.errorCode === 2105) {
            statusText = "Tài khoản không tồn tại hoặc không online";
            statusType = "failed";
          }

          // Thành công
          else if (
            data?.message?.includes("Success") || // FIXED
            data?.status === 0 // FIXED
          ) {
            statusText = "Redeem thành công";
            statusType = "success";
          }

          // Đã redeem
          else if (data?.message?.includes("Đã redeem")) {
            statusText = "Đã redeem";
            statusType = "redeemed";
          }

          // Trường hợp khác
          else {
            statusText = data?.message || "Lỗi không xác định";
            statusType = "failed";
          }
        } else {
          statusText = "Lỗi kết nối: " + result.error;
          statusType = "failed";
        }

        updateUserStatus(user.id, statusType, statusText);
      } catch (e: any) {
        updateUserStatus(user.id, "failed", "Lỗi hệ thống: " + e.toString());
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setIsProcessing(false);
  };

  const updateUserStatus = (id: string, status: UserStatus, message = "") => {
    setUserList((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status,
              message,
              lastUpdated: new Date().toLocaleString(),
            }
          : user
      )
    );
  };

  const filteredUsers = userList.filter((user) =>
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: UserStatus) => {
    console.log("🚀 ~ getStatusBadge ~ status:", status);
    switch (status) {
      case "success":
        return <Badge className="bg-green-500 text-white">Thành công</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">Thất bại</Badge>;
      case "redeemed":
        return <Badge className="bg-orange-600 text-white">Đã dùng</Badge>;
      case "processing":
        return (
          <Badge className="bg-yellow-400 text-black animate-pulse">
            Đang xử lý
          </Badge>
        );
      default:
        return <Badge className="bg-slate-400 text-white">Bình thường</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#DFF4FD] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Bomber VNG
              </h1>
              <p className="text-muted-foreground font-medium">
                Nhập code hàng loạt
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto items-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild disabled={isProcessing}>
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none font-semibold"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nhập ID nhân vật
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Thêm danh sách nhân vật</DialogTitle>
                  <DialogDescription>
                    Nhập danh sách User ID (mỗi dòng 1 ID hoặc cách nhau bằng
                    dấu phẩy)
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Textarea
                    placeholder="VD: user123&#10;user456&#10;user789"
                    className="min-h-[150px] font-mono text-sm"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                  />
                  {duplicateError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Trùng lặp</AlertTitle>
                      <AlertDescription className="text-xs mt-1 break-all">
                        {duplicateError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleAddUsers}>Thêm vào danh sách</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              size="lg"
              onClick={handleScan}
              disabled={isProcessing || userList.length === 0 || !redeemCode}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Bắt đầu Nhập
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Redeem Code Input */}
        <Card>
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
            {/* Input */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="redeem-code">Thông tin Code</Label>
              <Input
                id="redeem-code"
                placeholder="NHẬP THÔNG TIN CODE..."
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
              />
            </div>

            {/* Số lượng nhân vật */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <span>Số lượng nhân vật:</span>
              <span className="font-bold text-primary text-lg">
                {userList.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User List Table */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b px-6 py-4">
            <div>
              <CardTitle className="text-xl">Danh sách nhân vật</CardTitle>
              <CardDescription>
                Danh sách ID sẽ được xử lý lần lượt
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm ID..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] pl-6">STT</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="w-[130px]">Trạng thái</TableHead>
                  <TableHead className="">Chi tiết</TableHead>
                  <TableHead className="w-[150px]">Thời gian</TableHead>
                  <TableHead className="text-right pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-16 text-primary font-semibold text-center"
                      >
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCw className="animate-spin h-5 w-5" />
                          Đang tải dữ liệu...
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-16 text-muted-foreground"
                    >
                      Chưa có tài khoản
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-6">{index + 1}</TableCell>
                      <TableCell>{user.userId}</TableCell>
                      <TableCell className="w-[130px]">
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="truncate max-w-[250px]">
                        {user.message || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.lastUpdated}
                      </TableCell>
                      <TableCell className="text-right pr-4 flex gap-1 justify-end">
                        {/* Edit */}
                        <Dialog
                          open={editingUser?.id === user.id}
                          onOpenChange={(open) => !open && setEditingUser(null)}
                        >
                          <DialogTrigger asChild disabled={isProcessing}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cập nhật User ID</DialogTitle>
                              <DialogDescription>
                                Chỉnh sửa User ID
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                              <Label>User ID</Label>
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                              >
                                Hủy
                              </Button>
                              <Button onClick={handleUpdateUser}>
                                Lưu thay đổi
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild disabled={isProcessing}>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa tài khoản</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa {user.userId}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <footer className="w-full py-4 text-center text-sm text-muted-foreground border-t border-gray-200 dark:border-gray-700">
        <span>Được làm bởi Auth•Chin or Ⓡ Chin</span>
      </footer>
    </div>
  );
}

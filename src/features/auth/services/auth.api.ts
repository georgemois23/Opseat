import api from "@/lib/axios";

export async function login(data: {
  email: string;
  password: string;
}) {
  const res = await api.post("/auth/login", {
    email: data.email, 
    password: data.password
  });
    return res.data;
}

export async function register(data: {
  email: string;
  password: string;
}) {
  const res = await api.post("/auth/signup", data);
  return res.data;
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function logout() {
  await api.post("/auth/logout");
}
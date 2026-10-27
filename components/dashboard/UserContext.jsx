"use client";
import { createContext, useContext } from "react";

export const UserContext = createContext({
  user: null,
  setUser: () => {},
  notify: () => {},
});

export const useDashboard = () => useContext(UserContext);

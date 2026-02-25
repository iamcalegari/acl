import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export default function AuthedLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

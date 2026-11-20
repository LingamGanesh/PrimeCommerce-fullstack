import { Outlet } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import fetchUserDetails from "./utils/fetchUserDetails";
import { useEffect } from "react";
import { setUserDetails } from "./store/userSlice";
import { useDispatch } from "react-redux";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    const fetchUserData = async () => {
      const userData = await fetchUserDetails();
      if (active && userData?.data) {
        dispatch(setUserDetails(userData.data));
      }
    };

    fetchUserData();

    return () => {
      active = false;
    };
  }, [dispatch]);

  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </>
  );
}

export default App;

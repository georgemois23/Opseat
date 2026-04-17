import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./components/Header";
import BackendWakeDialog from "./components/BackendWakeDialog";
// import Footer from "./components/Footer";

export default function Layout() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh' 
      }}
    >
      <Header />
      <BackendWakeDialog />
      
      {/* - component="main" is good for accessibility (SEO)
          - flexGrow: 1 ensures the footer stays at the bottom if the content is short
          - mt: 10 matches your Header height (80px / 8px spacing units = 10)
      */}
      <Box 
        component="main"  
      >
        <Outlet />
      </Box>

      {/* <Footer /> */}
    </Box>
  );
}
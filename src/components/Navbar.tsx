
import { useState } from "react";
import { Menu, X, Bell, LogOut, User, Users, Mail } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import RescuerNavbar from "./navbar/RescuerNavbar";
import TrainerNavbar from "./navbar/TrainerNavbar";
import EstablishmentNavbar from "./navbar/EstablishmentNavbar";

const Navbar = () => {
  const location = useLocation();
  
  // Déterminer quel type de navbar afficher en fonction de l'URL
  const isTrainerProfileSection = location.pathname.startsWith("/trainer-profile");
  const isEstablishmentProfileSection = location.pathname.startsWith("/establishment-profile");
  
  if (isTrainerProfileSection) {
    return <TrainerNavbar />;
  }
  
  if (isEstablishmentProfileSection) {
    return <EstablishmentNavbar />;
  }
  
  return <RescuerNavbar />;
};

export default Navbar;

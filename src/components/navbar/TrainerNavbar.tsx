import { memo } from "react";
import { MobileHeader } from "@/components/navigation/MobileHeader";

const TrainerNavbar = memo(() => {
  return <MobileHeader profileType="formateur" />;
});

TrainerNavbar.displayName = "TrainerNavbar";

export default TrainerNavbar;

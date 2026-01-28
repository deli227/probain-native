import { memo } from "react";
import { MobileHeader } from "@/components/navigation/MobileHeader";

const RescuerNavbar = memo(() => {
  return <MobileHeader profileType="maitre_nageur" />;
});

RescuerNavbar.displayName = "RescuerNavbar";

export default RescuerNavbar;

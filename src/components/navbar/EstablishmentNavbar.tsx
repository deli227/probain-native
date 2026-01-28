import { memo } from "react";
import { MobileHeader } from "@/components/navigation/MobileHeader";

const EstablishmentNavbar = memo(() => {
  return <MobileHeader profileType="etablissement" />;
});

EstablishmentNavbar.displayName = "EstablishmentNavbar";

export default EstablishmentNavbar;

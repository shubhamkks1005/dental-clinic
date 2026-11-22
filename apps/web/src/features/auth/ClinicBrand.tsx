import { useEffect, useState } from "react";
import { Logo } from "../../ui/Logo";
import { getBranding, type Branding } from "./api";

// Clinic logo and name from Settings (public branding endpoint). Logo null = placeholder mark.
export function ClinicBrand() {
  const [brand, setBrand] = useState<Branding | null>(null);
  useEffect(() => {
    getBranding()
      .then(setBrand)
      .catch(() => setBrand({ clinicName: null, logo: null }));
  }, []);

  return (
    <div className="start-brand">
      {brand?.logo ? <img className="start-logo" src={brand.logo} alt="" /> : <Logo />}
      {brand?.clinicName && <p className="start-clinic">{brand.clinicName}</p>}
    </div>
  );
}

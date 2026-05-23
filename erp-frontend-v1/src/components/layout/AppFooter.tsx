import { useTranslation } from "@/i18n/useTranslation";

const AppFooter: React.FC = () => {
  const { t } = useTranslation();

  // Personal branding values (edit as needed)
  const designerName = "Ahmed abdelal";
  const contactNumber = "+20 1032900752";
  const whatsappNumber = contactNumber.replace(/\D/g, "");
  const platformName = t<string>("common.footer.platformName");

  const designedBy = t<string>("common.footer.designedBy", {
    name: designerName,
  });
  const contact = t<string>("common.footer.contact");
  const whatsappMessage = t<string>("common.footer.whatsappMessage", {
    company: platformName,
  });
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-[var(--text-secondary)]">
      <span>{designedBy}</span>
      <span className="hidden sm:inline">|</span>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t<string>("common.footer.whatsappAriaLabel", {
          phone: contactNumber,
        })}
        className="inline-flex items-center rounded-full border border-[#25D366] px-3 py-1 font-medium transition-colors hover:bg-[#25D366]/10"
      >
        {contact} {contactNumber}
      </a>
    </div>
  );
};

export default AppFooter;

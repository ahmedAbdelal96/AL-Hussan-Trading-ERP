import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router";

export default function NotificationDropdown() {
  const [notifying, setNotifying] = useState(true);

  const handleOpen = () => {
    setNotifying(false);
  };

  const notifications = [
    {
      id: 1,
      user: "Terry Franci",
      image: "/images/user/user-02.jpg",
      message: "requests permission to change",
      project: "Project - Nganter App",
      category: "Project",
      time: "5 min ago",
      online: true,
    },
    {
      id: 2,
      user: "Alena Franci",
      image: "/images/user/user-03.jpg",
      message: "requests permission to change",
      project: "Project - Nganter App",
      category: "Project",
      time: "8 min ago",
      online: true,
    },
    {
      id: 3,
      user: "Jocelyn Kenter",
      image: "/images/user/user-04.jpg",
      message: "requests permission to change",
      project: "Project - Nganter App",
      category: "Project",
      time: "15 min ago",
      online: true,
    },
    {
      id: 4,
      user: "Brandon Philips",
      image: "/images/user/user-05.jpg",
      message: "requests permission to change",
      project: "Project - Nganter App",
      category: "Project",
      time: "1 hr ago",
      online: false,
    },
  ];

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--input-border)] bg-[var(--surface)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
          <span
            className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
              !notifying ? "hidden" : "flex"
            }`}
          >
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
          <svg
            className="fill-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[350px] sm:w-[361px] max-h-[480px] overflow-y-auto p-3"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b">
          <h5 className="text-lg font-semibold">Notification</h5>
        </div>

        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex cursor-pointer gap-3 rounded-lg p-3 hover:bg-[var(--surface-hover)]"
          >
            <span className="relative block w-10 h-10 rounded-full shrink-0">
              <img
                width={40}
                height={40}
                src={notification.image}
                alt={notification.user}
                className="w-full h-full overflow-hidden rounded-full"
              />
              <span
                className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--surface)] ${
                  notification.online ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
            </span>

            <span className="block flex-1">
              <span className="mb-1.5 block text-sm text-[var(--text-tertiary)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {notification.user}
                </span>{" "}
                {notification.message}{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  {notification.project}
                </span>
              </span>

              <span className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span>{notification.category}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--icon-tertiary)]"></span>
                <span>{notification.time}</span>
              </span>
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-3" />

        <DropdownMenuItem asChild>
          <Link
            to="/"
            className="block px-4 py-2 text-sm font-medium text-center rounded-lg cursor-pointer"
          >
            View All Notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

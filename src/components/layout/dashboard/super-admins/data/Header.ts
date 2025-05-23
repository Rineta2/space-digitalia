import { FiHome, FiSettings } from "react-icons/fi";

import { RiAdminFill } from "react-icons/ri";

import { GrArticle } from "react-icons/gr";

import { FiLayout } from "react-icons/fi";

import { FaBuildingUser } from "react-icons/fa6";

import { MdOutlineHomeRepairService, MdUnsubscribe } from "react-icons/md";

import { GoProject } from "react-icons/go";

import { IoMdContact } from "react-icons/io";

export const menuItems = [
  {
    icon: FiHome,
    label: "Dashboard",
    href: "/dashboard/super-admins",
  },

  {
    icon: FiLayout,
    label: "Layout",
    href: "/dashboard/super-admins/layout",
    subItems: [
      { label: "Home", href: "/dashboard/super-admins/layout/home" },

      {
        label: "Featured",
        href: "/dashboard/super-admins/layout/featured",
      },

      {
        label: "Service",
        href: "/dashboard/super-admins/layout/service",
      },

      {
        label: "Company",
        href: "/dashboard/super-admins/layout/company",
      },

      {
        label: "Testimonials",
        href: "/dashboard/super-admins/layout/testimonials",
      },
    ],
  },

  {
    icon: FaBuildingUser,
    label: "About",
    href: "/dashboard/super-admins/about",
    subItems: [
      { label: "About", href: "/dashboard/super-admins/about" },

      {
        label: "Team",
        href: "/dashboard/super-admins/about/team",
      },
    ],
  },

  {
    icon: MdOutlineHomeRepairService,
    label: "Service",
    href: "/dashboard/super-admins/service",
    subItems: [
      { label: "Service", href: "/dashboard/super-admins/service" },

      {
        label: "Count Testimoni",
        href: "/dashboard/super-admins/service/count-testimonial",
      },
    ],
  },

  {
    icon: GoProject,
    label: "Project",
    href: "/dashboard/super-admins/project",
    subItems: [
      { label: "Daftar Project", href: "/dashboard/super-admins/project" },
      { label: "Status", href: "/dashboard/super-admins/project/status" },
      { label: "Category", href: "/dashboard/super-admins/project/category" },
      { label: "Type", href: "/dashboard/super-admins/project/type" },
      { label: "Licence", href: "/dashboard/super-admins/project/license" },
      { label: "Framework", href: "/dashboard/super-admins/project/framework" },
    ],
  },

  {
    icon: GrArticle,
    label: "Article",
    href: "/dashboard/super-admins/article",
    subItems: [
      { label: "Daftar Article", href: "/dashboard/super-admins/article" },
      { label: "Category", href: "/dashboard/super-admins/article/category" },
      { label: "Tags", href: "/dashboard/super-admins/article/tags" },
    ],
  },

  {
    icon: IoMdContact,
    label: "Contact",
    href: "/dashboard/super-admins/contact",
  },

  {
    icon: MdUnsubscribe,
    label: "Subscription",
    href: "/dashboard/super-admins/subscription",
  },

  {
    icon: RiAdminFill,
    label: "Accounts",
    href: "/dashboard/super-admins/accounts",
    subItems: [
      { label: "Admins", href: "/dashboard/super-admins/accounts/admins" },
      { label: "User", href: "/dashboard/super-admins/accounts/user" },
    ],
  },

  {
    icon: FiSettings,
    label: "Pengaturan",
    href: "/dashboard/super-admins/settings",
    subItems: [
      { label: "Profile", href: "/dashboard/super-admins/settings/profile" },
      { label: "Security", href: "/dashboard/super-admins/settings/security" },
    ],
  },

  {
    icon: FiHome,
    label: "Home",
    href: "/",
  },
];

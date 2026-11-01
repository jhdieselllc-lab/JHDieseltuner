import { createFileRoute } from "@tanstack/react-router";
import { JHDieselDesktop } from "@/components/jh-diesel/desktop";

export const Route = createFileRoute("/")({ component: JHDieselDesktop });

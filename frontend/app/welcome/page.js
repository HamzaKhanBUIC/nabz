import WelcomePage from "@/components/welcome/WelcomePage";

export const metadata = {
  title: "Welcome",
  description:
    "Nabz is a crew health app for Mars missions: a three-minute check-in against each astronaut's own normal, written rules for what to do on board, and emergency guides that open without signing in.",
};

export default function Welcome() {
  return <WelcomePage />;
}

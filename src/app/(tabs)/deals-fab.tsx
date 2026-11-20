import { Redirect } from 'expo-router';

// Placeholder route for the raised center Deals button in the tab bar.
// The button itself navigates to /deals — this file exists only so the
// tab slot can be declared; it never renders meaningfully.
export default function DealsFabRoute() {
  return <Redirect href="/deals" />;
}

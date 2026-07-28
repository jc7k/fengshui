import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Placeholder landing. REQ-014 replaces this with the real one; all it owes the
// PRD §5 flow today is a way into the editor.
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white">
      <Text className="text-2xl font-semibold text-neutral-900">
        Feng Shui Layout Analyzer
      </Text>
      <Link
        href="/design"
        testID="cta-design"
        className="rounded-full bg-blue-600 px-5 py-3 text-base font-medium text-white"
      >
        Design your room
      </Link>
    </View>
  );
}

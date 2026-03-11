import 'package:integration_test/integration_test.dart';
import 'pillar_smoke_test.dart' as smoke;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  smoke.main();
}

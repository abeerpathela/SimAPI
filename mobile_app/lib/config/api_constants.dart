import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  static String get baseUrl {
    // Priority: .env > fallback for Android Emulator > fallback for local
    return dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:4000';
  }

  // Add other constants here if needed
  static const String socketPath = '/socket.io/';
}

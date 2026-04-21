import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// API Key Provider
final apiKeyProvider = StateNotifierProvider<ApiKeyNotifier, String?>((ref) {
  return ApiKeyNotifier();
});

class ApiKeyNotifier extends StateNotifier<String?> {
  ApiKeyNotifier() : super(null) {
    _loadApiKey();
  }

  Future<void> _loadApiKey() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getString('api_key');
  }

  Future<void> setApiKey(String apiKey) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_key', apiKey);
    state = apiKey;
  }

  Future<void> clearApiKey() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('api_key');
    state = null;
  }
}

// Device Name Provider
final deviceNameProvider = StateNotifierProvider<DeviceNameNotifier, String>((ref) {
  return DeviceNameNotifier();
});

class DeviceNameNotifier extends StateNotifier<String> {
  DeviceNameNotifier() : super('My Android Phone') {
    _loadDeviceName();
  }

  Future<void> _loadDeviceName() async {
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('device_name');
    if (savedName != null) {
      state = savedName;
    }
  }

  Future<void> setDeviceName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('device_name', name);
    state = name;
  }
}

// Connection Status Provider
final isConnectedProvider = StateProvider<bool>((ref) => false);

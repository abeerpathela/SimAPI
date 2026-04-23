import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/api_constants.dart';

class SocketService {
  static String get baseUrl => ApiConstants.baseUrl;
  
  io.Socket? _socket;
  final StreamController<Map<String, dynamic>> _messageController = StreamController.broadcast();
  final StreamController<bool> _connectionController = StreamController.broadcast();

  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  void connect(String apiKey, String deviceName) {
    print('🔗 Connecting to: $baseUrl');
    print('🔑 Using API key: ${apiKey.substring(0, 16)}...');
    print('📱 Device name: $deviceName');

    _socket = io.io(baseUrl, {
      'transports': ['websocket'],
      'autoConnect': true,
      'secure': true,
      'path': ApiConstants.socketPath,
      'query': {
        'apiKey': apiKey,
        'deviceName': deviceName,
      },
      'auth': {
        'apiKey': apiKey,
        'deviceName': deviceName,
      },
    });

    _socket!.onConnect((_) {
      print('✅ SOCKET CONNECTED');
      _connectionController.add(true);
    });

    _socket!.onDisconnect((_) {
      print('❌ SOCKET DISCONNECTED');
      _connectionController.add(false);
    });

    _socket!.onConnectError((err) {
      print('❌ CONNECT ERROR: $err');
    });

    _socket!.onError((err) {
      print('❌ SOCKET ERROR: $err');
    });

    _socket!.on("connected", (data) {
      print('✅ Backend confirmed connection: $data');
      _connectionController.add(true);
    });

    _socket!.on('send_message', (data) {
      print('📨 [Socket] Received message job: $data');
      _messageController.add(Map<String, dynamic>.from(data));
    });
  }

  void sendHeartbeat() {
    if (_socket != null && _socket!.connected) {
      print('💓 [Socket] Sending heartbeat...');
      _socket!.emit('heartbeat');
    } else {
      print('⚠️ [Socket] Heartbeat skipped: Not connected');
    }
  }

  void sendStatusUpdate(String messageId, String status, {String? error}) {
    if (_socket != null && _socket!.connected) {
      print('📤 [Socket] Sending status update: $messageId -> $status ${error != null ? "($error)" : ""}');
      _socket!.emit('message_status', {
        'message_id': messageId,
        'status': status,
        'error': error,
      });
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
    }
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}

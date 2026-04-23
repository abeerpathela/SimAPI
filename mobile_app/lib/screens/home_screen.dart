import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/providers/app_providers.dart';
import 'package:mobile_app/services/socket_service.dart';
import 'package:mobile_app/services/sms_service.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final SocketService _socketService = SocketService();
  final SmsService _smsService = SmsService();
  Timer? _heartbeatTimer;
  final List<Map<String, dynamic>> _messageLogs = [];
  String? _lastError;
  final int _retryCount = 3;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _processMessage(Map<String, dynamic> message) async {
    final messageId = message['message_id'];
    final toNumber = message['to_number'];
    final content = message['content'];

    print('📥 [Home] Processing job $messageId for $toNumber');

    setState(() {
      _messageLogs.insert(0, {
        'id': messageId,
        'to': toNumber,
        'content': content,
        'status': 'queued',
        'time': DateTime.now(),
      });
    });

    int attempts = 0;
    bool success = false;
    String? lastErrorReason;

    while (attempts < _retryCount && !success) {
      attempts++;
      print('🚀 [Home] SMS Attempt $attempts for $messageId');
      
      setState(() {
        _messageLogs[0]['status'] = 'sending (try $attempts)';
      });

      try {
        await _smsService.sendSms(
          toNumber: toNumber,
          message: content,
        );
        success = true;
        print('✅ [Home] SMS $messageId sent successfully on attempt $attempts');
      } catch (e) {
        lastErrorReason = e.toString();
        print('⚠️ [Home] Attempt $attempts failed for $messageId: $e');
        if (attempts < _retryCount) {
          await Future.delayed(const Duration(seconds: 2));
        }
      }
    }

    if (success) {
      setState(() {
        _messageLogs[0]['status'] = 'sent';
      });
      _socketService.sendStatusUpdate(messageId, 'sent');
    } else {
      setState(() {
        _messageLogs[0]['status'] = 'failed';
        _lastError = 'Last Job Failed: $lastErrorReason';
      });
      print('❌ [Home] SMS $messageId failed all $_retryCount attempts');
      _socketService.sendStatusUpdate(messageId, 'failed', error: lastErrorReason);
    }
  }

  Future<void> _initializeServices() async {
    final apiKey = ref.read(apiKeyProvider);
    final deviceName = ref.read(deviceNameProvider);
    if (apiKey != null) {
      bool hasPerms = await _smsService.requestPermissions();
      if (!hasPerms) {
        setState(() => _lastError = 'Permission Denied: SMS/Phone');
      }

      // Check battery optimizations
      bool isOptimized = await Permission.ignoreBatteryOptimizations.isDenied;
      if (isOptimized) {
        print('🔋 [Home] Battery optimizations are enabled. This may kill the background connection.');
      }
      
      _socketService.connect(apiKey, deviceName);

      _socketService.connectionStream.listen((isConnected) {
        ref.read(isConnectedProvider.notifier).state = isConnected;
      });

      _socketService.messageStream.listen((message) {
        _processMessage(message);
      });

      _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        _socketService.sendHeartbeat();
      });
    }
  }

  @override
  void dispose() {
    _heartbeatTimer?.cancel();
    _socketService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isConnected = ref.watch(isConnectedProvider);
    final apiKey = ref.watch(apiKeyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SimAPI Debug Console'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _initializeServices(),
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              PopupMenuItem(
                child: const ListTile(
                  leading: Icon(Icons.logout),
                  title: Text('Disconnect'),
                ),
                onTap: () {
                  ref.read(apiKeyProvider.notifier).clearApiKey();
                },
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status Card
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isConnected ? Icons.cloud_done : Icons.cloud_off,
                                color: isConnected ? Colors.green : Colors.red,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                isConnected ? 'Online' : 'Offline',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isConnected ? Colors.green : Colors.red,
                                ),
                              ),
                            ],
                          ),
                          Text('Queue: ${_messageLogs.where((m) => m['status'].toString().contains('sending')).length} active'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.battery_alert, size: 16),
                        label: const Text('Disable Battery Optimization', style: TextStyle(fontSize: 12)),
                        onPressed: () async {
                          await Permission.ignoreBatteryOptimizations.request();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange[100],
                          foregroundColor: Colors.orange[900],
                        ),
                      ),
                      if (_lastError != null) ...[
                        const Divider(),
                        Text(
                          _lastError!,
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Debug Info
              if (_messageLogs.isNotEmpty)
                Card(
                  color: Colors.grey[900],
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('LATEST JOB DEBUG', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10)),
                        Text('ID: ${_messageLogs[0]['id']}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                        Text('To: ${_messageLogs[0]['to']}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                        Text('Status: ${_messageLogs[0]['status']}', style: const TextStyle(color: Colors.greenAccent, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Live Job Logs', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            TextButton(onPressed: () => setState(() => _messageLogs.clear()), child: const Text('Clear')),
                          ],
                        ),
                        const Divider(),
                        Expanded(
                          child: _messageLogs.isEmpty
                              ? const Center(child: Text('Waiting for jobs...'))
                              : ListView.builder(
                                  itemCount: _messageLogs.length,
                                  itemBuilder: (context, index) {
                                    final log = _messageLogs[index];
                                    return ListTile(
                                      dense: true,
                                      leading: Icon(
                                        log['status'] == 'sent'
                                            ? Icons.check_circle
                                            : log['status'] == 'failed'
                                                ? Icons.error
                                                : Icons.sync,
                                        color: log['status'] == 'sent'
                                            ? Colors.green
                                            : log['status'] == 'failed'
                                                ? Colors.red
                                                : Colors.orange,
                                      ),
                                      title: Text('${log['to']}'),
                                      subtitle: Text('${log['content']}', maxLines: 1, overflow: TextOverflow.ellipsis),
                                      trailing: Text('${log['status']}', style: const TextStyle(fontSize: 10)),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

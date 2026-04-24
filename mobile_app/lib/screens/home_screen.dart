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

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    final apiKey = ref.read(apiKeyProvider);
    final deviceName = ref.read(deviceNameProvider);
    if (apiKey != null) {
      await _smsService.requestPermissions();
      _socketService.connect(apiKey, deviceName);

      _socketService.connectionStream.listen((isConnected) {
        ref.read(isConnectedProvider.notifier).state = isConnected;
      });

      _socketService.messageStream.listen((message) async {
        setState(() {
          _messageLogs.insert(0, {
            'id': message['message_id'],
            'to': message['to_number'],
            'content': message['content'],
            'status': 'sending',
            'time': DateTime.now(),
          });
        });

        try {
          await _smsService.sendSms(
            toNumber: message['to_number'],
            message: message['content'],
          );

          setState(() {
            _messageLogs[0]['status'] = 'sent';
          });

          _socketService.sendStatusUpdate(message['message_id'], 'sent');
        } catch (e) {
          setState(() {
            _messageLogs[0]['status'] = 'failed';
          });

          _socketService.sendStatusUpdate(message['message_id'], 'failed');
        }
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
        title: const Text('SimAPI'),
        centerTitle: true,
        actions: [
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
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isConnected ? Icons.check_circle : Icons.error,
                            color: isConnected ? Colors.green : Colors.red,
                            size: 32,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            isConnected ? 'Connected' : 'Disconnected',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isConnected ? Colors.green : Colors.red,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (apiKey != null)
                        Text(
                          'API Key: ${apiKey.substring(0, 12)}...',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Message Logs',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 16),
                        Expanded(
                          child: _messageLogs.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.message,
                                        size: 64,
                                        color: Colors.grey[400],
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No messages yet',
                                        style: TextStyle(color: Colors.grey[600]),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.builder(
                                  itemCount: _messageLogs.length,
                                  itemBuilder: (context, index) {
                                    final log = _messageLogs[index];
                                    return ListTile(
                                      leading: CircleAvatar(
                                        backgroundColor: log['status'] == 'sent'
                                            ? Colors.green
                                            : log['status'] == 'failed'
                                                ? Colors.red
                                                : Colors.orange,
                                        child: Icon(
                                          log['status'] == 'sent'
                                              ? Icons.check
                                              : log['status'] == 'failed'
                                                  ? Icons.close
                                                  : Icons.hourglass_empty,
                                          color: Colors.white,
                                        ),
                                      ),
                                      title: Text(log['to']),
                                      subtitle: Text(
                                        log['content'],
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      trailing: Text(
                                        '${log['time'].hour.toString().padLeft(2, '0')}:${log['time'].minute.toString().padLeft(2, '0')}',
                                        style: TextStyle(color: Colors.grey[600]),
                                      ),
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

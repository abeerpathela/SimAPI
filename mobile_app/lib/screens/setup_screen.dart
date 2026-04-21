import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/providers/app_providers.dart';

class SetupScreen extends ConsumerStatefulWidget {
  const SetupScreen({super.key});

  @override
  ConsumerState<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends ConsumerState<SetupScreen> {
  late final TextEditingController _apiKeyController;
  late final TextEditingController _deviceNameController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _apiKeyController = TextEditingController();
    _deviceNameController = TextEditingController(text: ref.read(deviceNameProvider));
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    _deviceNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SimAPI Setup'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.phone_android,
                size: 80,
                color: Colors.blue,
              ),
              const SizedBox(height: 24),
              Text(
                'Welcome to SimAPI',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your API key to connect your phone to SimAPI',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _apiKeyController,
                decoration: const InputDecoration(
                  labelText: 'API Key',
                  hintText: 'sim_live_...',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.key),
                ),
                autocorrect: false,
                enableSuggestions: false,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _deviceNameController,
                decoration: const InputDecoration(
                  labelText: 'Device Name (Optional)',
                  hintText: 'My Android Phone',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.devices),
                ),
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: _isLoading
                    ? null
                    : () async {
                        if (_apiKeyController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please enter your API key'),
                              backgroundColor: Colors.red,
                            ),
                          );
                          return;
                        }

                        setState(() {
                          _isLoading = true;
                        });

                        final name = _deviceNameController.text.trim().isEmpty 
                            ? 'My Android Phone' 
                            : _deviceNameController.text.trim();
                        
                        await ref.read(deviceNameProvider.notifier).setDeviceName(name);
                        await ref.read(apiKeyProvider.notifier).setApiKey(_apiKeyController.text.trim());

                        setState(() {
                          _isLoading = false;
                        });
                      },
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Connect to SimAPI'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

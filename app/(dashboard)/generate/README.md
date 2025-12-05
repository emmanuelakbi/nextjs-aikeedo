# Text Generation Page

This page provides a comprehensive interface for AI text generation with support for multiple models, presets, and parameter controls.

## Features

### Prompt Input Area

- Large textarea for entering prompts
- Character counter with visual feedback
- Keyboard shortcut support (Ctrl/Cmd + Enter to submit)
- Auto-resizing textarea

### Result Display Area

- Clean display of generated text
- Loading state with spinner
- Error handling with retry option
- Copy to clipboard functionality
- Metadata display (model, tokens, credits, duration)

### Model Selector

- Dropdown list of available AI models
- Search functionality
- Model information display (provider, context window, pricing)
- Availability status indicators
- Deprecated model warnings with replacement suggestions
- Automatic filtering by text-generation capability

### Preset Selector

- Dropdown list of available presets
- Search functionality
- Category-based organization
- Usage count display
- Automatic application of preset template and parameters
- Support for both system and workspace presets

### Parameter Controls

- Temperature control (0-2)
- Max Tokens control (100-4000)
- Top P control (0-1)
- Frequency Penalty control (0-2)
- Presence Penalty control (0-2)
- Collapsible panel to save space
- Real-time value display
- Helpful descriptions for each parameter

### Generation History

- Local history of recent generations
- Quick access to previous prompts and results
- Timestamp and metadata display
- Click to reload previous generation

## Requirements Satisfied

- **Requirement 2.1**: Text generation with AI models
- **Requirement 2.3**: Parameter controls (temperature, max tokens, top_p)
- **Requirement 9.2**: Preset selection and application

## API Integration

### GET /api/ai/models

Fetches available AI models with text-generation capability.

### GET /api/presets

Fetches available presets including system presets.

### POST /api/ai/completions

Generates text completion with the following parameters:

- `prompt`: The input text
- `model`: Selected model ID
- `provider`: Model provider
- `temperature`: Randomness control
- `maxTokens`: Maximum output length
- `topP`: Nucleus sampling parameter
- `frequencyPenalty`: Repetition reduction
- `presencePenalty`: Topic diversity control

## Components Used

- `PromptInput`: Text input component with character counter
- `GenerationResult`: Result display with copy and retry functionality
- `ModelSelector`: Model selection dropdown with search
- `PresetSelector`: Preset selection dropdown with search
- `ParameterControls`: Slider controls for generation parameters
- `Button`: Reusable button component
- `Spinner`: Loading indicator

## Usage

1. Navigate to `/generate` in the dashboard
2. Optionally select a preset to pre-fill the prompt and parameters
3. Select an AI model from the dropdown
4. Adjust parameters if needed (collapsible panel)
5. Enter or modify the prompt
6. Click "Generate" or press Ctrl/Cmd + Enter
7. View the generated result with metadata
8. Copy the result or retry if needed
9. Access previous generations from the history panel

## Error Handling

- Model loading errors
- Preset loading errors (non-blocking)
- Generation errors with retry option
- Insufficient credits error
- Provider unavailability error
- Validation errors

## Future Enhancements

- Save generations to database
- Share generations with workspace members
- Export generations in various formats
- Batch generation support
- Generation templates
- Advanced parameter presets

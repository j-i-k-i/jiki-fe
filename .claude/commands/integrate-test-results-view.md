I've copy-pasted a now folder with all its files into components/complex-exercise.
The folder is called test-results-view.

Your job is to integrate it into the codebase.

Whenever we press the run code button in the complex exercise, the test results view should be shown below the code editor.
For now just use a mock data. You can piece together a data-structure test-results view needs from the code in the test-results-view folder.

Create types for each data-type.

The core component is TestResultsButtons, because those are used to step between each test results. Generate a mock object that spawns when we press the run code button. This will change but now for the sake of testing.

Analyse the code, and put any state that it needs into the Orchestrator component.
Everything is centralised in the Orchestrator component.

If you feel something is not good enough in test-results-view, feel free to refactor the code. But first integrate it, and make it render properly.

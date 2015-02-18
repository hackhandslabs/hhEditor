# HH UI - Editor
Code colaboration editor with tab support.

## Features
- Tab system support
- Multiuser (unlimited)
- Bidirectional syntax change

## Config

* **firebase** defaults to `null`
	* A complete firebase url. A new child object will be created to mannage everything (tabs and editors)

* **syntax** defaults to `JavaScript` (case-sensitive)
	* Default code editor syntax for newly created tabs

* **theme** defaults to `ace/theme/monokai` (case-sensitive)
	* Defaul theme for the code editor

* **readOnly** defaults to `false`
	* Is the editor read only mode

* **initialText** defaults to `empty`
	* When the component is initialized, if there are no tabs on firebase, a new tab will be created with this text/content

* **initialSyntax** defaults to previously defined `syntax` value
	* Default syntax for initialText tab

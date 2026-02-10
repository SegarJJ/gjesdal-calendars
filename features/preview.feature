Feature: Preview calendar
  As a resident of Gjesdal municipality
  I want to preview the calendar before downloading
  So that I can verify the dates are correct

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: Preview button is disabled until selections are complete
    Then the preview button should be disabled

  Scenario: Preview button is enabled when route and waste types are selected
    Given the user has selected "Rute 1"
    And at least one waste type is selected
    Then the preview button should be enabled
    And the preview button label should be "👁 Forhåndsvisning"

  Scenario: Opening the preview panel
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the preview button
    Then the preview panel should become visible
    And the preview should show a heading with the number of upcoming events
    And the preview should list events sorted by date

  Scenario: Preview shows event details
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the preview button
    Then each event in the preview should show the date formatted in Norwegian
    And each event should show the waste type icon and name
    And each event should have a coloured left border matching the waste type

  Scenario: Preview limits displayed events
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the preview button
    Then at most 20 upcoming events should be displayed
    And if there are more than 20 upcoming events, a message should indicate how many more remain

  Scenario: Preview indicates past events
    Given the user has selected "Rute 3"
    And all waste types are selected
    And some collection dates have already passed
    When the user clicks the preview button
    Then the preview should note how many events are already past

  Scenario: Preview shows raw ICS content
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user clicks the preview button
    Then the preview should contain a collapsed "Vis rå ICS-fil" section
    When the user expands the raw ICS section
    Then the raw ICS content should be displayed in a preformatted code block
    And it should begin with "BEGIN:VCALENDAR"

  Scenario: Toggling the preview panel closed
    Given the user has selected "Rute 3"
    And all waste types are selected
    And the preview panel is open
    When the user clicks the preview button again
    Then the preview panel should be hidden

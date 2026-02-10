Feature: Alert / reminder configuration
  As a resident of Gjesdal municipality
  I want to configure reminders for collection days
  So that I don't forget to put out my bins

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: Available alert presets are shown
    Then the alert selector should display 3 alert options
      | id              | label                    |
      | evening-before  | Kvelden før (kl. 18)     |
      | 12h             | 12 timer før             |
      | morning         | Om morgenen (kl. 07)     |

  Scenario: Default alert is "Kvelden før"
    Then the "Kvelden før (kl. 18)" alert should be checked

  Scenario: Selecting multiple alerts
    Given the "Kvelden før (kl. 18)" alert is checked
    When the user checks the "Om morgenen (kl. 07)" alert
    Then both "Kvelden før (kl. 18)" and "Om morgenen (kl. 07)" should be checked
    And the summary should show 2 reminders per event

  Scenario: Deselecting all alerts
    When the user unchecks all alert options
    Then no alert checkboxes should be checked
    And the summary should show "Ingen påminnelser"

  Scenario: Alerts are optional
    Given the user has selected "Rute 1"
    And all waste types are selected
    And no alerts are selected
    Then the download button should be enabled
    And the preview button should be enabled

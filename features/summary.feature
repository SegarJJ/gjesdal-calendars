Feature: Calendar summary
  As a resident of Gjesdal municipality
  I want to see a summary of my configured calendar
  So that I can verify my choices before downloading

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: Summary is empty when no route is selected
    Then the summary should display "Velg rute og avfallstyper for å se en oppsummering."

  Scenario: Summary updates when route and waste types are selected
    When the user selects "Rute 3"
    And all waste types are selected
    Then the summary should show the total number of events
    And the summary should list each waste type with its event count
    And the summary should show the number of reminders per event

  Scenario: Summary shows correct counts for Rute 3 with all waste types
    When the user selects "Rute 3"
    And all waste types are selected
    Then the summary should show 57 events total
    And the breakdown should show:
      | waste type             | count |
      | Matavfall              | 13    |
      | Restavfall/Bleiedunk   | 26    |
      | Papp/Papir             | 13    |
      | Glass/Metallemballasje  | 5     |

  Scenario: Summary updates when waste types change
    Given the user has selected "Rute 3"
    And all waste types are selected
    When the user unchecks "Glass/Metallemballasje"
    Then the summary should show 52 events total

  Scenario: Summary shows alert configuration
    Given the user has selected "Rute 1"
    And the "Kvelden før (kl. 18)" alert is checked
    Then the summary should display "Kvelden før (kl. 18)" under reminders

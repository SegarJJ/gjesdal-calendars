Feature: Waste type selection
  As a resident of Gjesdal municipality
  I want to choose which waste types to include in my calendar
  So that I only see collection dates relevant to me

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: All waste types are shown
    Then the waste type selector should display 4 waste types
      | id         | name                   | icon |
      | matavfall  | Matavfall              | 🍏   |
      | restavfall | Restavfall/Bleiedunk   | 🗑️   |
      | papir      | Papp/Papir             | 📦   |
      | glass      | Glass/Metalemballasje  | 🫙   |

  Scenario: All waste types are selected by default
    Then all waste type checkboxes should be checked

  Scenario: Deselecting a waste type
    When the user unchecks "Matavfall"
    Then "Matavfall" should not be selected
    And the summary should not include Matavfall events

  Scenario: Selecting a previously deselected waste type
    Given the user has unchecked "Papp/Papir"
    When the user checks "Papp/Papir"
    Then "Papp/Papir" should be selected
    And the summary should include Papp/Papir events

  Scenario: Select all waste types
    Given the user has unchecked "Matavfall"
    And the user has unchecked "Restavfall/Bleiedunk"
    When the user clicks "Velg alle"
    Then all waste type checkboxes should be checked

  Scenario: Select no waste types
    When the user clicks "Velg ingen"
    Then no waste type checkboxes should be checked
    And the download button should be disabled
    And the preview button should be disabled

  Scenario: At least one waste type is required for download
    Given the user has selected "Rute 1"
    And no waste types are selected
    Then the download button should be disabled
    And the summary should show a prompt to select waste types

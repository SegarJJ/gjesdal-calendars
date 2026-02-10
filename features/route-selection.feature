Feature: Route selection
  As a resident of Gjesdal municipality
  I want to select my waste collection route
  So that I get the correct collection dates for my area

  Background:
    Given the user has opened the Tømmekalender page

  Scenario: Page shows all four routes
    Then the route selector should display 4 route options
      | route | name   |
      | 1     | Rute 1 |
      | 2     | Rute 2 |
      | 3     | Rute 3 |
      | 4     | Rute 4 |

  Scenario: No route is selected by default
    Then no route should be selected
    And the download button should be disabled
    And the preview button should be disabled

  Scenario: Selecting a route
    When the user selects "Rute 3"
    Then "Rute 3" should be marked as selected
    And the summary should update to show event counts for Rute 3

  Scenario: Changing the selected route
    Given the user has selected "Rute 1"
    When the user selects "Rute 2"
    Then "Rute 2" should be marked as selected
    And "Rute 1" should no longer be selected

  Scenario: Viewing route details
    When the user clicks the info button for "Rute 3"
    Then a modal should appear with the route description
    And the modal should list the areas belonging to that route
    And the modal should show the number of calendar events available

  Scenario: Closing the route details modal
    Given the route details modal is open for "Rute 3"
    When the user clicks the close button on the modal
    Then the modal should be dismissed

  Scenario: Closing the route details modal by clicking outside
    Given the route details modal is open for "Rute 3"
    When the user clicks outside the modal
    Then the modal should be dismissed

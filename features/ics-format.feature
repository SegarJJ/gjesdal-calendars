Feature: ICS file format compliance
  As a calendar application
  I need the generated .ics files to follow RFC 5545
  So that events import correctly

  Scenario: ICS file structure
    Given a calendar is generated for "Rute 3" with all waste types and no alerts
    Then the file should have a VCALENDAR wrapper
    And the VCALENDAR should contain:
      | property       | value                                      |
      | VERSION        | 2.0                                        |
      | CALSCALE       | GREGORIAN                                  |
      | METHOD         | PUBLISH                                    |
      | X-WR-TIMEZONE  | Europe/Oslo                                |

  Scenario: Calendar name matches route
    Given a calendar is generated for "Rute 1" with all waste types
    Then X-WR-CALNAME should be "Gjesdal Tømmekalender 2026 - Rute 1"

  Scenario: VEVENT properties
    Given a calendar is generated for "Rute 3" with "Matavfall" on "2026-01-07"
    Then the event should have:
      | property    | value                                    |
      | UID         | gjesdal-r3-matavfall-2026-01-07@calendar |
      | DTSTART     | 20260107 (VALUE=DATE)                    |
      | SUMMARY     | 🍏 Matavfall                             |
      | DESCRIPTION | Matavfall tømmedag - Matrester og organisk avfall |
      | TRANSP      | TRANSPARENT                              |
    And the event should have a DTSTAMP in UTC format

  Scenario: Events are sorted chronologically
    Given a calendar is generated for "Rute 3" with all waste types
    Then the VEVENTs should appear in ascending date order

  Scenario: UIDs are unique across all events
    Given a calendar is generated for "Rute 3" with all waste types
    Then every VEVENT should have a unique UID

  Scenario: Long lines are folded at 75 octets
    Given a calendar is generated with a SUMMARY longer than 75 characters
    Then the line should be folded with CRLF followed by a space

  Scenario: All-day events
    Given a calendar is generated for any route
    Then every VEVENT should use DTSTART with VALUE=DATE (no time component)
    And TRANSP should be TRANSPARENT
    And X-MICROSOFT-CDO-BUSYSTATUS should be FREE

  Scenario: VALARM structure
    Given a calendar is generated for "Rute 3" with "Matavfall" and the "Kvelden før" alert
    Then the VEVENT should contain a VALARM with:
      | property    | value                  |
      | ACTION      | DISPLAY                |
      | TRIGGER     | -PT6H                  |
      | DESCRIPTION | Matavfall henting      |

  Scenario: Multiple alerts per event
    Given a calendar is generated with alerts "Kvelden før" and "Om morgenen"
    Then each VEVENT should contain 2 VALARM blocks
    And one VALARM should have TRIGGER "-PT6H"
    And the other should have TRIGGER "-PT17H"

  Scenario: PRODID includes calendar name
    Given a calendar is generated for "Rute 3"
    Then PRODID should contain "Gjesdal Tømmekalender 2026 - Rute 3"

  Scenario: Line endings are CRLF
    Given any generated ICS file
    Then all line endings should be CRLF (\\r\\n)

  Scenario: Invalid route number
    When a calendar is requested for route 99
    Then an error should be thrown with message "Route 99 not found"
